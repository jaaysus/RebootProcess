using System.Security.Cryptography;
using System.Text;
using QRCoder;

namespace DynamicWiApi.Utils;

public static class OperatorAuthUtils
{
    // Generate password: clean name + random string
    public static string GeneratePassword(string fullName)
    {
        var clean = fullName.Replace(" ", "").ToLower();
        var random = GenerateRandomString(40);
        return $"{clean}_{random}";
    }

    private static string GenerateRandomString(int length)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var data = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(data);

        var sb = new StringBuilder(length);
        foreach (var b in data)
            sb.Append(chars[b % chars.Length]);

        return sb.ToString();
    }

    // Generate QR code PNG bytes from string
    public static byte[] GenerateQr(string content)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        using var qr = new PngByteQRCode(data);
        return qr.GetGraphic(20);
    }
}
