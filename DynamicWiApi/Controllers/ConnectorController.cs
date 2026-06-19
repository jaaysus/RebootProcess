using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
namespace DynamicWiApi.Controllers;

[ApiController]
[Route("connectors")]
[Authorize] // require JWT authentication
public class ConnectorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ConnectorsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /connectors - any authenticated user
    [HttpGet]
    public IActionResult GetConnectors()
    {
        return Ok(_db.Connectors.ToList());
    }

    // POST /connectors - Admin & ProcessTechnician
    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.ProcessTechnician}")]
    public IActionResult CreateConnector(Connector connector)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        var currentUser = _db.Users.Find(Guid.Parse(userIdClaim!));

        _db.Connectors.Add(connector);
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Create",
            Entity = "Connector",
            Identifier = currentUser?.FullName!,
            Details = $"Connector {connector.Name} created"
        });

        _db.SaveChanges();
        return Ok(connector);
    }

    // PUT /connectors/{id} - Admin & ProcessTechnician
    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.ProcessTechnician}")]
    public IActionResult UpdateConnector(Guid id, Connector connectorUpdate)
    {
        var connector = _db.Connectors.Find(id);
        if (connector == null)
            return NotFound();

        connector.Name = connectorUpdate.Name;
        connector.Description = connectorUpdate.Description;
        connector.Type = connectorUpdate.Type;
        connector.UpdatedAt = DateTime.UtcNow;

        var userIdClaim = User.FindFirst("UserId")?.Value;
        var currentUser = _db.Users.Find(Guid.Parse(userIdClaim!));

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Update",
            Entity = "Connector",
            Identifier = currentUser?.FullName!,
            Details = $"Connector {connector.Name} updated"
        });

        _db.SaveChanges();
        return Ok(connector);
    }

    // DELETE /connectors/{id} - Admin & ProcessTechnician
    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.ProcessTechnician}")]
    public IActionResult DeleteConnector(Guid id)
    {
        var connector = _db.Connectors.Find(id);
        if (connector == null)
            return NotFound();

        var userIdClaim = User.FindFirst("UserId")?.Value;
        var currentUser = _db.Users.Find(Guid.Parse(userIdClaim!));

        _db.Connectors.Remove(connector);
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "Delete",
            Entity = "Connector",
            Identifier = currentUser?.FullName!,
            Details = $"Connector {connector.Name} deleted"
        });

        _db.SaveChanges();
        return Ok();
    }
}
