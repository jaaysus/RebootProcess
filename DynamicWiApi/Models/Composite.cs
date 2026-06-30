using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DynamicWiApi.Models
{
    public class Composite
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string CompositeName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string CompositeCode { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}