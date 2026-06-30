using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models
{
    public class CompositeCreateDTO
    {
        [Required]
        [MaxLength(255)]
        public string CompositeName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string CompositeCode { get; set; } = string.Empty;
    }

    public class CompositeUpdateDTO
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string CompositeName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string CompositeCode { get; set; } = string.Empty;
    }
}