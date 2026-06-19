namespace DynamicWiApi.Models;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Action { get; set; } = null!;
    public string Entity { get; set; } = null!;
    public string Identifier { get; set; } = null!;
    public string Details { get; set; } = null!;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
