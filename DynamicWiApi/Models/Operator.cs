namespace DynamicWiApi.Models;

public class Operator
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Badge { get; set; } = null!;
    public string FullName { get; set; } = null!;

    
    public string Password { get; set; } = null!;

    
    public byte[] QrCodeImage { get; set; } = null!;
}
