import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

# Fast test execution defaults
os.environ.setdefault("USE_SQLITE_TEST", "true")
os.environ.setdefault("TEST_DATABASE_URL", "sqlite:///:memory:")
