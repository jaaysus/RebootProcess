using Microsoft.AspNetCore.Mvc;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
using DynamicWiApi.Utils;
using ClosedXML.Excel;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace DynamicWiApi.Controllers;

[ApiController]
[Route("api/operators")]
public class OperatorsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public OperatorsController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    
    [HttpGet]
    public IActionResult GetOperators()
    {
        var operators = _db.Operators.Select(o => new
        {
            o.Id,
            o.Badge,
            o.FullName,
            o.Password 
        }).ToList();

        return Ok(operators);
    }

    [HttpGet("{badge}")]
    public IActionResult GetOperatorByBadge(string badge)
    {
        var op = _db.Operators
            .Where(o => o.Badge == badge)
            .Select(o => new
            {
                o.Id,
                o.Badge,
                o.FullName,
                o.Password
            })
            .FirstOrDefault();

        if (op == null)
            return NotFound(new { error = "Operator not found" });

        return Ok(op);
    }


    [HttpPost]
    public IActionResult CreateOperator(OperatorCreateDTO dto)
    {
        if (_db.Operators.Any(o => o.Badge == dto.Badge))
            return BadRequest("Badge already exists");

        
        var password = OperatorAuthUtils.GeneratePassword(dto.FullName);
        var qr = OperatorAuthUtils.GenerateQr(password);

        var op = new Operator
        {
            Badge = dto.Badge,
            FullName = dto.FullName,
            Password = password,
            QrCodeImage = qr
        };

        _db.Operators.Add(op);
        _db.SaveChanges();

        return Ok(new
        {
            op.Id,
            op.Badge,
            op.FullName,
            generatedPassword = password
        });
    }


    [HttpPost("login")]
    public IActionResult Login(OperatorLoginDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Badge) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Badge and password are required");

        var op = _db.Operators.FirstOrDefault(o => o.Badge == dto.Badge);
        if (op == null || op.Password != dto.Password)
            return Unauthorized("Invalid credentials");

        
        var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]!);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("OperatorId", op.Id.ToString()),
                new Claim(ClaimTypes.Name, op.FullName),
                new Claim("Badge", op.Badge)
            }),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);

        return Ok(new
        {
            token = handler.WriteToken(token),
            operatorInfo = new { op.Id, op.Badge, op.FullName }
        });
    }

    

    
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        var operatorIdClaim = User.FindFirst("OperatorId")?.Value;
        var op = operatorIdClaim != null ? _db.Operators.Find(Guid.Parse(operatorIdClaim)) : null;

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Logout",
            Entity = "Operator",
            Identifier = op?.Badge!,
            Details = op != null
                ? $"Operator {op.FullName} ({op.Badge}) logged out"
                : "Anonymous logout attempt"
        });
        _db.SaveChanges();

        return Ok(new { message = "Logout recorded" });
    }

    
    [HttpGet("{badge}/qr")]
    public IActionResult ViewQr(string badge)
    {
        var op = _db.Operators.FirstOrDefault(o => o.Badge == badge);
        if (op == null) return NotFound(new { error = "Operator not found" });

        
        return File(op.QrCodeImage, "image/png");
    }

    [HttpPost("{badge}/regenerate-credentials")]
    public IActionResult RegenerateCredentials(string badge)
    {
        var op = _db.Operators.FirstOrDefault(o => o.Badge == badge);
        if (op == null)
            return NotFound(new { error = "Operator not found" });

        var newPassword = OperatorAuthUtils.GeneratePassword(op.FullName);
        var newQr = OperatorAuthUtils.GenerateQr(newPassword);

        op.Password = newPassword;
        op.QrCodeImage = newQr;

        _db.SaveChanges();

        return Ok(new
        {
            message = "Credentials regenerated",
            badge = op.Badge,
            fullName = op.FullName,
            newPassword = newPassword
        });
    }

    
    
    [HttpGet("{badge}/qr/download")]
    public IActionResult DownloadQr(string badge)
    {
        var op = _db.Operators.FirstOrDefault(o => o.Badge == badge);
        if (op == null) return NotFound(new { error = "Operator not found" });

        
        return File(op.QrCodeImage, "image/png", $"{badge}_password_qr.png");
    }

    [HttpPut("{badge}")]
    public IActionResult UpdateOperator(string badge, OperatorUpdateDTO dto)
    {
        var op = _db.Operators.FirstOrDefault(o => o.Badge == badge);
        if (op == null)
            return NotFound(new { error = "Operator not found" });

        // Badge change
        if (!string.IsNullOrWhiteSpace(dto.Badge) && dto.Badge != badge)
        {
            if (_db.Operators.Any(o => o.Badge == dto.Badge))
                return BadRequest("This badge already exists");

            op.Badge = dto.Badge;
        }

        // Name change
        if (!string.IsNullOrWhiteSpace(dto.FullName))
            op.FullName = dto.FullName;

        // Manual password set
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            op.Password = dto.Password;
            op.QrCodeImage = OperatorAuthUtils.GenerateQr(dto.Password);
        }

        _db.SaveChanges();

        return Ok(new
        {
            message = "Operator updated",
            op.Id,
            op.Badge,
            op.FullName
        });
    }


    
    [HttpDelete("{badge}")]
    public IActionResult DeleteOperator(string badge)
    {
        var op = _db.Operators.FirstOrDefault(o => o.Badge == badge);
        if (op == null) return NotFound();

        _db.Operators.Remove(op);
        _db.SaveChanges();
        return Ok();
    }

    
    [HttpPost("upload-excel")]
    public IActionResult UploadOperatorsExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Excel file required");

        var operators = new List<Operator>();

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets.First();

        foreach (var row in sheet.RowsUsed().Skip(1))
        {
            var badge = row.Cell(1).GetString().Trim();
            var fullName = row.Cell(2).GetString().Trim();

            if (string.IsNullOrEmpty(badge) || string.IsNullOrEmpty(fullName))
                continue;

            if (_db.Operators.Any(o => o.Badge == badge))
                continue;

            var password = OperatorAuthUtils.GeneratePassword(fullName);
            var qr = OperatorAuthUtils.GenerateQr(password);

            operators.Add(new Operator
            {
                Badge = badge,
                FullName = fullName,
                Password = password,
                QrCodeImage = qr
            });
        }

        _db.Operators.AddRange(operators);
        _db.SaveChanges();

        return Ok(new { inserted = operators.Count });
    }
}
