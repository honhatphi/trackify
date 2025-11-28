var builder = DistributedApplication.CreateBuilder(args);

// Add PostgreSQL database
var postgres = builder.AddPostgres("postgres")
    .WithPgAdmin()
    .WithDataVolume();

var database = postgres.AddDatabase("trackifydb");

// Add Redis cache
var redis = builder.AddRedis("redis")
    .WithRedisInsight()
    .WithDataVolume();

// Add Trackify API
builder.AddProject<Projects.Trackify_API>("trackify-api")
    .WithReference(database)
    .WithReference(redis)
    .WaitFor(database)
    .WaitFor(redis);

await builder.Build().RunAsync();
