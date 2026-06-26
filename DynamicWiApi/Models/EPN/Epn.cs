using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models;

public class Epn
{
    public int Id { get; set; }

    public string EpnCode { get; set; } = "";

    public int CavityCount { get; set; }

    public int? PhotoId { get; set; }

    public EpnPhoto? Photo { get; set; }

    public ICollection<EpnCavity> Cavities { get; set; }
        = new List<EpnCavity>();

    public bool NeedsCoordination { get; set; }
}