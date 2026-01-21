import random

def generate_random_number(min_value, max_value):
  """
  Generates a random integer within a specified range.

  Args:
    min_value: The minimum value of the range.
    max_value: The maximum value of the range.

  Returns:
    A random integer between min_value and max_value (inclusive).
  """
  return random.randint(min_value, max_value)

if __name__ == "__main__":
  # Example usage:
  min_range = 1
  max_range = 100
  random_num = generate_random_number(min_range, max_range)
  print(f"A random number between {min_range} and {max_range} is: {random_num}")
