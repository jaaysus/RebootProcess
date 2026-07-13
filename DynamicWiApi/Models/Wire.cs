using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models;

/// <summary>
/// One physical wire. In the source spreadsheet a wire that runs between two
/// connectors appears as two rows sharing the same WireNumber (one per end);
/// a wire that terminates at a splice on one side may appear as a single row.
/// Both cases are represented here as one Wire with 1-2 WireEnds.
/// </summary>
public class Wire
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string WireNumber { get; set; } = string.Empty;

    public double Csa { get; set; }

    public double Length { get; set; }

    /// <summary>Core/twisted-pair spec string, e.g. "CR-C-KT132-V13".</summary>
    [MaxLength(150)]
    public string Core { get; set; } = string.Empty;

    /// <summary>Base insulation color.</summary>
    [MaxLength(10)]
    public string ColorC1 { get; set; } = string.Empty;

    /// <summary>Tracer / secondary insulation color.</summary>
    [MaxLength(10)]
    public string ColorC2 { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Module { get; set; } = string.Empty;

    /// <summary>
    /// Raw ST+SPLICE column value, e.g. "ST011" or "S1SB303NA". Every Wire
    /// whose WireEnd sits at a splice pseudo-cavity (see WireEnd.IsSpliceCavity)
    /// shares this code with every other wire joined at that same splice — an
    /// n-way junction, not a 1:1 pairing. Kept as a plain grouping string
    /// (not a hard FK to a Splice table) so lookups stay a simple equality
    /// query, matching the existing bySplice grouping in the frontend.
    /// </summary>
    [MaxLength(100)]
    public string? SpliceCode { get; set; }

    public ICollection<WireEnd> Ends { get; set; } = new List<WireEnd>();
}