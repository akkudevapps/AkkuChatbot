using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Tesseract;

namespace AkkuChatbot.Services
{
    public class NativeOcrService : INativeOcrService
    {
        private readonly TesseractEngine? _engine;

        public NativeOcrService(Lazy<TesseractEngine?> engineAccessor)
        {
            _engine = engineAccessor.Value;
        }

        public async Task<string> ExtractTextAsync(byte[] imageBytes, string language = "eng+tam+hin")
        {
            if (_engine == null)
                return "❌ OCR service is not available. Please contact the administrator.";

            return await Task.Run(() =>
            {
                using var img = Pix.LoadFromMemory(imageBytes);
                using var page = _engine.Process(img, PageSegMode.Auto);
                return page.GetText();
            });
        }

        public async Task<List<List<string>>> ExtractTableAsync(byte[] imageBytes, string language = "eng+tam+hin")
        {
            if (_engine == null)
                return new List<List<string>>();   // empty table indicates unavailability

            return await Task.Run(() =>
            {
                using var img = Pix.LoadFromMemory(imageBytes);
                using var page = _engine.Process(img, PageSegMode.Auto);
                var fullText = page.GetText();
                var lines = fullText.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);
                return lines.Select(line => line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).ToList()).ToList();
            });
        }
    }
}