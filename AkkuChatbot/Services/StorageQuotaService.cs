public interface IStorageQuotaService
{
    bool CanUserUpload(string userId, long additionalBytes);
    long GetUserTotalBytes(string userId);
}

public class StorageQuotaService : IStorageQuotaService
{
    private readonly IWebHostEnvironment _env;
    private readonly long _limitBytes;

    public StorageQuotaService(IWebHostEnvironment env, IConfiguration config)
    {
        _env = env;
        _limitBytes = config.GetValue<long>("UserStorageLimitMB", 100) * 1024 * 1024;
    }

    public bool CanUserUpload(string userId, long additionalBytes)
        => GetUserTotalBytes(userId) + additionalBytes <= _limitBytes;

    public long GetUserTotalBytes(string userId)
    {
        var dir = Path.Combine(_env.WebRootPath, "uploads", userId);
        if (!Directory.Exists(dir)) return 0;
        return Directory.GetFiles(dir, "*", SearchOption.AllDirectories)
                        .Sum(f => new FileInfo(f).Length);
    }
}