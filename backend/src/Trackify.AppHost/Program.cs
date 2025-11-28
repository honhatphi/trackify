var builder = DistributedApplication.CreateBuilder(args);

// Add PostgreSQL database (requires Docker)
var postgres = builder.AddPostgres("postgres")
    .WithPgAdmin()
    .WithDataVolume();

var database = postgres.AddDatabase("trackifydb");

// Add Redis cache (requires Docker)
var redis = builder.AddRedis("redis")
    .WithRedisInsight()
    .WithDataVolume();

// Add Trackify API
// Note: Remove .WaitFor() if you want to run API without Docker dependencies
builder.AddProject<Projects.Trackify_API>("trackify-api")
    .WithReference(database)
    .WithReference(redis);

await builder.Build().RunAsync();
