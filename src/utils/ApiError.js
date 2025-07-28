class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something Went Wrong",
    error = [],
    stack = ""
  ) {
    super(message); // This automatically sets the message property
    this.statusCode = statusCode;
    this.data = null; // Initialization
    this.success = false;
    this.error = error;

    if (stack) {
      this.stack = stack; // Use provided stack trace if available
    } else {
      Error.captureStackTrace(this, this.constructor); // Capture the stack trace automatically if no custom stack is passed
    }
  }
}

export { ApiError };
