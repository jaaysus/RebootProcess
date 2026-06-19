using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models;

public class ProcessExcelData
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [StringLength(500)]
    public string? DescriptionExtra { get; set; }

    [StringLength(100)]
    public string? SortieComponent { get; set; }

    [StringLength(100)]
    public string? Component { get; set; }

    [StringLength(100)]
    public string? AddedItems { get; set; }

    [StringLength(100)]
    public string? Core { get; set; }

    [StringLength(50)]
    public string? SpLoc { get; set; }

    [StringLength(50)]
    public string? Csa { get; set; }

    public int? Length { get; set; }

    [StringLength(100)]
    public string? WireName { get; set; }

    [StringLength(50)]
    public string? C1 { get; set; }

    [StringLength(50)]
    public string? C2 { get; set; }

    [StringLength(50)]
    public string? C3 { get; set; }

    [StringLength(50)]
    public string? Node1 { get; set; }

    [StringLength(50)]
    public string? Cav1 { get; set; }

    [StringLength(50)]
    public string? Node2 { get; set; }

    [StringLength(50)]
    public string? Cav2 { get; set; }

    [StringLength(100)]
    public string? Module { get; set; }

    [StringLength(100)]
    public string? Station { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(50)]
    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [StringLength(50)]
    public string? UpdatedBy { get; set; }
}
