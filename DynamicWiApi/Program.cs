using DynamicWiApi.Data;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.CLI;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;



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
            .WithOrigins(frontendUrl)
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
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "default-key-change-in-production")
            )
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();


app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "DynamicWiApi v1");
});

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await UserCli.HandleAsync(args, db);

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();
app.MapGet("/", () => Results.Redirect("/index.html"));

app.MapControllers();
app.MapFallbackToFile("index.html");
app.Run();

