from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance
import os
import tempfile
import logging
import io
import easyocr  # fallback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ✅ Tesseract path – adjust if needed
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

# Lazy load EasyOCR reader (it's heavy)
_reader = None
def get_easyocr_reader():
    global _reader
    if _reader is None:
        logger.info("Initializing EasyOCR reader (first use)...")
        _reader = easyocr.Reader(['en', 'ta', 'hi'], gpu=False)  # add languages as needed
    return _reader

def preprocess_image(img: Image.Image) -> Image.Image:
    """Enhance image for better OCR."""
    # Convert to grayscale
    img = img.convert('L')
    # Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    # Apply slight sharpening
    img = img.filter(ImageFilter.SHARPEN)
    # Binarize using threshold
    img = img.point(lambda x: 0 if x < 140 else 255, '1')
    return img

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/ocr', methods=['POST'])
def ocr_image():
    logger.info("OCR Request received")
    
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image provided', 'text': ''}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected', 'text': ''}), 400

    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': f'Invalid file. Allowed: {", ".join(ALLOWED_EXTENSIONS)}',
            'text': ''
        }), 400

    # Optional parameters
    lang = request.form.get('lang', 'eng+tam+hin')  # default Tesseract language
    psm = int(request.form.get('psm', 6))           # page segmentation mode
    use_easyocr = request.form.get('use_easyocr', 'false').lower() == 'true'

    temp_path = None
    try:
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(temp_path)
        img = Image.open(temp_path)

        extracted_text = ""
        method = "tesseract"

        if use_easyocr:
            # EasyOCR method
            reader = get_easyocr_reader()
            img_array = np.array(img.convert('RGB'))  # EasyOCR expects RGB numpy array
            results = reader.readtext(img_array, detail=0, paragraph=True)
            extracted_text = '\n'.join(results)
            method = "easyocr"
        else:
            # Tesseract with preprocessing
            img_processed = preprocess_image(img)
            custom_config = f'--psm {psm} -l {lang}'
            extracted_text = pytesseract.image_to_string(
                img_processed,
                config=custom_config
            ).strip()
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        logger.info(f"{method} extracted {len(extracted_text)} chars")
        return jsonify({
            'success': True,
            'text': extracted_text,
            'language': lang,
            'method': method,
            'error': ''
        })

    except Exception as e:
        logger.error(f"OCR Error: {str(e)}")
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({
            'success': False,
            'error': f'OCR Failed: {str(e)}',
            'text': ''
        }), 500

@app.route('/ocr/table', methods=['POST'])
def ocr_table():
    """Extract data from tables (returns structured JSON)."""
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image', 'data': []}), 400

    file = request.files['image']
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'Invalid file type', 'data': []}), 400

    lang = request.form.get('lang', 'eng+tam+hin')
    temp_path = None
    try:
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(temp_path)
        img = Image.open(temp_path)
        img_processed = preprocess_image(img)

        # PSM 6 for uniform block, get TSV output
        tsv_data = pytesseract.image_to_data(
            img_processed,
            lang=lang,
            config='--psm 6',
            output_type=pytesseract.Output.DICT
        )
        # Convert to list of rows
        rows = []
        current_row = []
        last_block_num = -1
        for i in range(len(tsv_data['text'])):
            word = tsv_data['text'][i].strip()
            if word:
                block_num = tsv_data['block_num'][i]
                if block_num != last_block_num:
                    if current_row:
                        rows.append(current_row)
                    current_row = []
                    last_block_num = block_num
                current_row.append(word)
        if current_row:
            rows.append(current_row)

        os.remove(temp_path)
        return jsonify({'success': True, 'data': rows, 'error': ''})

    except Exception as e:
        logger.error(f"Table OCR error: {e}")
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'success': False, 'error': str(e), 'data': []}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        version = pytesseract.get_tesseract_version()
        return jsonify({
            'status': 'running',
            'tesseract_version': str(version),
            'languages': ['Tamil', 'English', 'Hindi']
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting OCR Service on http://127.0.0.1:5001")
    try:
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract found: {version}")
    except:
        print("❌ Tesseract not found!")
    app.run(host='0.0.0.0', port=5001, debug=True)