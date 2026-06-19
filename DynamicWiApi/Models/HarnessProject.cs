namespace DynamicWiApi.Models;

public class HarnessProject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ModelName { get; set; } = null!;
    public string ModelYear { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
