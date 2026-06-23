using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
namespace DynamicWiApi.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = Roles.Admin)] 
public class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditLogsController(AppDbContext db)
    {
        _db = db;
    }

    
    [HttpGet]
    public IActionResult GetAllLogs(
        [FromQuery] string? entity = null,
        [FromQuery] string? Identifier = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 50;

        var query = _db.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(entity))
            query = query.Where(a => a.Entity == entity);

        if (!string.IsNullOrEmpty(Identifier))
            query = query.Where(a => a.Identifier == Identifier);

        var totalCount = query.Count();

        var logs = query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            logs
        });
    }

    
    [HttpGet("{id}")]
    public IActionResult GetLog(Guid id)
    {
        var log = _db.AuditLogs.Find(id);
        if (log == null)
            return NotFound();

        return Ok(log);
    }
}
