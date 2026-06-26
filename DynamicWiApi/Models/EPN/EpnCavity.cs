using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models;
public class EpnCavity
{
    public int Id { get; set; }

    public int EpnId { get; set; }

    public int CavityNumber { get; set; }

    public int X { get; set; }

    public int Y { get; set; }

    public int Size { get; set; }

    public string Shape { get; set; } = "";
}