import sys
import os

# Add the project root to the path
sys.path.append(os.getcwd())

try:
    from app import create_app
    app = create_app()
    client = app.test_client()

    print("\n--- Verifying Routing Table ---")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint:30} {rule.rule}")

    print("\n--- Testing /api/v1/employees/ ---")
    # Test with slash
    res1 = client.get('/api/v1/employees/')
    print(f"GET /api/v1/employees/  -> Status: {res1.status_code}")

    # Test without slash
    res2 = client.get('/api/v1/employees')
    print(f"GET /api/v1/employees   -> Status: {res2.status_code}")

except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
