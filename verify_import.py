import sys
print("--- Python Environment ---")
print(f"Executable: {sys.executable}")
print("Path:")
for p in sys.path:
    print(f"  - {p}")
print("--------------------------\n")

try:
    print("Attempting to import 'moviepy.editor'...")
    from moviepy.editor import VideoFileClip
    print("\nSUCCESS: Successfully imported 'VideoFileClip' from 'moviepy.editor'.")
except ImportError as e:
    print(f"\nERROR: Failed to import moviepy.editor. Details: {e}")
except Exception as e:
    print(f"\nUNEXPECTED ERROR: {e}")
