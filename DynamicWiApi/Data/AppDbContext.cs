using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Models;

namespace DynamicWiApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Operator> Operators => Set<Operator>();
    public DbSet<Composite> Composites => Set<Composite>();
    public DbSet<ModuleList> ModuleLists => Set<ModuleList>();
    public DbSet<ModuleListEntry> ModuleListEntries => Set<ModuleListEntry>();

    public DbSet<Epn> Epns => Set<Epn>();
    public DbSet<EpnPhoto> EpnPhotos => Set<EpnPhoto>();
    public DbSet<EpnCavity> EpnCavities => Set<EpnCavity>();

    // Replaces the old flat WireData table.
    public DbSet<Node> Nodes => Set<Node>();
    public DbSet<Wire> Wires => Set<Wire>();
    public DbSet<WireEnd> WireEnds => Set<WireEnd>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Operator>()
            .HasIndex(o => o.Badge)
            .IsUnique();

        modelBuilder.Entity<Operator>()
            .Property(o => o.QrCodeImage)
            .HasColumnType("varbinary(max)");

        modelBuilder.Entity<Epn>()
            .HasIndex(e => e.EpnCode)
            .IsUnique();

        modelBuilder.Entity<Epn>()
            .HasMany(e => e.Cavities)
            .WithOne()
            .HasForeignKey(c => c.EpnId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Epn>()
            .HasOne(e => e.Photo)
            .WithMany(p => p.Epns)
            .HasForeignKey(e => e.PhotoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Composite>()
            .HasIndex(c => c.CompositeCode)
            .IsUnique();

        modelBuilder.Entity<ModuleList>()
            .HasOne(m => m.Uploader)
            .WithMany()
            .HasForeignKey(m => m.UploadedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ModuleList>()
            .HasMany(m => m.Entries)
            .WithOne(e => e.ModuleList)
            .HasForeignKey(e => e.ModuleListId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Node / Wire / WireEnd ────────────────────────────────────────

        modelBuilder.Entity<Node>()
            .HasIndex(n => n.Name)
            .IsUnique();

        modelBuilder.Entity<Node>()
            .HasOne(n => n.Epn)
            .WithMany(e => e.Nodes)
            .HasForeignKey(n => n.EpnId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Wire>()
            .HasIndex(w => w.WireNumber);

        modelBuilder.Entity<Wire>()
            .HasIndex(w => w.SpliceCode);

        modelBuilder.Entity<WireEnd>()
            .HasOne(we => we.Wire)
            .WithMany(w => w.Ends)
            .HasForeignKey(we => we.WireId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WireEnd>()
            .HasOne(we => we.Node)
            .WithMany(n => n.Ends)
            .HasForeignKey(we => we.NodeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WireEnd>()
            .HasIndex(we => new { we.NodeId, we.Cavity });
    }
}