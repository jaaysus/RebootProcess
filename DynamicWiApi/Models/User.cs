using System.Security.Cryptography;
using System.Text;

namespace DynamicWiApi.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string Role { get; set; } = null!;
    public bool IsApproved { get; set; } = false;   
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    
    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        return Convert.ToBase64String(
            sha256.ComputeHash(Encoding.UTF8.GetBytes(password))
        );
    }

    public bool VerifyPassword(string password)
        => PasswordHash == HashPassword(password);
}
