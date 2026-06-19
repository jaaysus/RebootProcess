using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
using System.Security.Claims;
using UserModel = DynamicWiApi.Models.User;

namespace DynamicWiApi.Controllers;

[ApiController]
[Route("users")]
[Authorize(Roles = $"{Roles.Admin},{Roles.ProcessTechnician}")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    // GET /users
    [HttpGet]
    public IActionResult GetUsers()
    {
        return Ok(_db.Users.ToList());
    }

    // GET /users/{id}
    [HttpGet("{id:guid}")]
    public IActionResult GetUserById(Guid id)
    {
        var user = _db.Users.Find(id);
        if (user == null)
            return NotFound(new { error = "User not found" });

        return Ok(user);
    }

    // POST /users  (Admin direct creation)
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public IActionResult CreateUser(UserModel user)
    {
        if (string.IsNullOrEmpty(user.PasswordHash))
            return BadRequest(new { error = "Password is required." });

        user.PasswordHash = UserModel.HashPassword(user.PasswordHash);
        user.IsApproved = true; 
        user.CreatedAt = DateTime.UtcNow;

        var currentUser = _db.Users.Find(Guid.Parse(User.FindFirst("UserId")!.Value));

        _db.Users.Add(user);

        // Audit - use FullName for user
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Create",
            Entity = currentUser?.Role!,
            Identifier = currentUser?.FullName!,
            Details = $"User {user.FullName} ({user.Email}) created with role {user.Role}"
        });

        _db.SaveChanges();
        return Ok(user);
    }

    // PUT /users/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public IActionResult UpdateUser(Guid id, UserModel userUpdate)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound(new { error = "User not found" });

        user.FullName = userUpdate.FullName;
        user.Role = userUpdate.Role;

        if (!string.IsNullOrEmpty(userUpdate.PasswordHash))
            user.PasswordHash = UserModel.HashPassword(userUpdate.PasswordHash);

        var currentUser = _db.Users.Find(Guid.Parse(User.FindFirst("UserId")!.Value));

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Update",
            Entity = currentUser?.Role!,
            Identifier = currentUser?.FullName!,
            Details = $"Admin {currentUser?.FullName} ({currentUser?.Email}) updated user {user.FullName}"
        });

        _db.SaveChanges();
        return Ok(user);
    }

    // DELETE /users/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public IActionResult DeleteUser(Guid id)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound(new { error = "User not found" });

        var currentUser = _db.Users.Find(Guid.Parse(User.FindFirst("UserId")!.Value));

        _db.Users.Remove(user);

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Delete",
            Entity = currentUser?.Role!,
            Identifier = currentUser?.FullName!,
            Details = $"Admin {currentUser?.FullName} ({currentUser?.Email}) deleted user {user.FullName}"
        });

        _db.SaveChanges();
        return Ok();
    }

    // GET /users/pending
    [HttpGet("pending")]
    [Authorize(Roles = Roles.Admin)]
    public IActionResult GetPendingUsers()
    {
        return Ok(_db.Users.Where(u => !u.IsApproved).ToList());
    }

    // POST /users/{id}/approve
    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = Roles.Admin)]
    public IActionResult ApproveUser(Guid id)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound(new { error = "User not found" });

        user.IsApproved = true;
        user.ApprovedAt = DateTime.UtcNow;

        var currentUser = _db.Users.Find(Guid.Parse(User.FindFirst("UserId")!.Value));

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Approve",
            Entity = currentUser?.Role!,
            Identifier = currentUser?.FullName!,
            Details = $"Admin {currentUser?.FullName} approved user {user.FullName} ({user.Email})"
        });

        _db.SaveChanges();
        return Ok(new { message = "User approved" });
    }

    // POST /users/{id}/suspend
    [HttpPost("{id:guid}/suspend")]
    [Authorize(Roles = Roles.Admin)]
    public IActionResult SuspendUser(Guid id)
    {
        var user = _db.Users.Find(id);
        if (user == null) return NotFound(new { error = "User not found" });

        var currentUser = _db.Users.Find(Guid.Parse(User.FindFirst("UserId")!.Value));

        user.IsApproved = false;
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Suspend",
            Entity = currentUser?.Role!,
            Identifier = currentUser?.FullName!,
            Details = $"Admin {currentUser?.FullName} suspended user {user.FullName} ({user.Email})"
        });

        _db.SaveChanges();

        return Ok(new { message = "User suspended (approval revoked)" });
    }


    [HttpGet("roles")]
    [AllowAnonymous]
    public IActionResult GetAllRoles()
    {
        var roles = typeof(Roles)
            .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy)
            .Where(f => f.IsLiteral && !f.IsInitOnly)
            .Select(f => f.GetRawConstantValue()?.ToString())
            .Where(r => r != null)
            .ToList();

        return Ok(roles);
    }

}
