using Microsoft.AspNetCore.Mvc;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using UserModel = DynamicWiApi.Models.User;

namespace DynamicWiApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // ================= ADMIN / TECH LOGIN =================
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDTO req)
    {
        var email = req?.Email;
        var password = req?.Password;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return BadRequest("Email and password are required");

        var user = _db.Users.FirstOrDefault(u => u.Email == email);
        if (user == null || !user.VerifyPassword(password))
            return Unauthorized("Invalid credentials");

        //Approval
        if (!user.IsApproved)
            return Unauthorized("Account pending admin approval");

        var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]!);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("UserId", user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = DateTime.UtcNow.AddHours(4),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);

        // Audit log for login
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Login",
            Entity = "User",
            Identifier = user.FullName,
            Details = $"User {user.FullName} ({user.Email}) logged in"
        });

        _db.SaveChanges();

        return Ok(new
        {
            token = handler.WriteToken(token),
            user = new { user.Id, user.FullName, user.Email, user.Role }
        });
    }


    // ================= PUBLIC REGISTRATION =================
    [HttpPost("register")]
    [AllowAnonymous]
    public IActionResult Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.Role))
        {
            return BadRequest(new { error = "All fields are required" });
        }

        if (_db.Users.Any(u => u.Email == dto.Email))
            return BadRequest(new { error = "User already exists" });

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = UserModel.HashPassword(dto.Password),
            Role = dto.Role,
            IsApproved = false
        };

        _db.Users.Add(user);

        // Audit logs only store FullName for users
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Register",
            Entity = "User",
            Identifier = dto.FullName,
            Details = $"Registration request submitted for {dto.FullName} ({dto.Email})"
        });

        _db.SaveChanges();

        return Ok(new { message = "Registration submitted for admin approval" });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        var user = userIdClaim != null ? _db.Users.Find(Guid.Parse(userIdClaim)) : null;

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Logout",
            Entity = "User",
            Identifier = user?.FullName!,
            Details = user != null
                ? $"User {user.FullName} ({user.Email}) logged out"
                : "Anonymous logout attempt"
        });
        _db.SaveChanges();

        return Ok(new { message = "Logout recorded" });
    }

}
