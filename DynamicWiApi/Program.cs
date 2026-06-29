using DynamicWiApi.Data;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.CLI;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IO;



var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = builder.Configuration["Cors:FrontendUrl"] ?? "http://localhost:5173";
        policy
            .WithOrigins(frontendUrl, "http://localhost:5500", "http://127.0.0.1:5500")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
            });
});

// Configure Authentication
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            )
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure photos directory before building app
var photosDirectory = builder.Configuration["PhotosDirectory"];
if (string.IsNullOrEmpty(photosDirectory))
{
    // Default to epn-photos folder in backend project root (outside wwwroot)
    photosDirectory = Path.Combine(Directory.GetCurrentDirectory(), "epn-photos");
}

Directory.CreateDirectory(photosDirectory);

var app = builder.Build();


app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "DynamicWiApi v1");
});

app.UseHttpsRedirection();

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await UserCli.HandleAsync(args, db);
await AdminCli.HandleAsync(args, db);

app.UseDefaultFiles();
app.UseStaticFiles();

// Serve photos from custom directory outside wwwroot to survive frontend builds
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(photosDirectory),
    RequestPath = "/epn-photos",
    OnPrepareResponse = ctx =>
    {
        // Set proper content types for images
        var extension = Path.GetExtension(ctx.File.Name).ToLowerInvariant();
        ctx.Context.Response.ContentType = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => ctx.Context.Response.ContentType
        };
    }
});


app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseRouting();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/index.html"));

app.MapControllers();
app.MapFallbackToFile("index.html");
app.Run();

