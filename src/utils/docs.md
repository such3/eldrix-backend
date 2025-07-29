---

## 📄 `ApiError` Class

### Description:

A custom error handler class extending the native `Error` object. It is used to throw standardized API errors with HTTP status codes, messages, and optional error detail arrays.

### ✅ Constructor Signature:

```js
new ApiError(statusCode, message, (error = []), (stack = ""));
```

### 🔧 Parameters:

| Name         | Type     | Required | Description                                                               |
| ------------ | -------- | -------- | ------------------------------------------------------------------------- |
| `statusCode` | `number` | ✅ Yes   | HTTP status code (e.g., 400, 401, 500).                                   |
| `message`    | `string` | ❌ No    | Human-readable error message (default: `"Something Went Wrong"`).         |
| `error`      | `array`  | ❌ No    | An array of detailed error messages or objects (e.g., form field issues). |
| `stack`      | `string` | ❌ No    | Optional stack trace. If omitted, captured automatically from context.    |

### 🧱 Properties:

| Property     | Type      | Description                                                     |
| ------------ | --------- | --------------------------------------------------------------- |
| `statusCode` | `number`  | The HTTP status code to return in the response.                 |
| `message`    | `string`  | The error message passed to the constructor.                    |
| `data`       | `null`    | Always `null` (used for consistency with successful responses). |
| `success`    | `boolean` | Always `false` (since it's an error).                           |
| `error`      | `array`   | Array of detailed error information.                            |
| `stack`      | `string`  | Captured or provided stack trace for debugging.                 |

### ✅ Example:

```js
throw new ApiError(400, "Invalid user input", [
  { field: "email", message: "Email is required" },
]);
```

---

## 📄 `ApiResponse` Class

### Description:

A standardized wrapper for successful API responses. It ensures consistency in status, message, and data fields returned by your application.

### ✅ Constructor Signature:

```js
new ApiResponse(statusCode, data, message);
```

### 🔧 Parameters:

| Name         | Type     | Required | Description                             |
| ------------ | -------- | -------- | --------------------------------------- |
| `statusCode` | `number` | ✅ Yes   | HTTP status code (e.g., 200, 201).      |
| `data`       | `any`    | ✅ Yes   | Payload data to return in the response. |
| `message`    | `string` | ✅ Yes   | Human-readable success message.         |

### 🧱 Properties:

| Property     | Type      | Description                                    |
| ------------ | --------- | ---------------------------------------------- |
| `statusCode` | `number`  | HTTP status code.                              |
| `message`    | `string`  | Description of the response.                   |
| `data`       | `any`     | Actual result data (e.g., object, array, etc). |
| `success`    | `boolean` | Automatically set to `true` if status < 400.   |

### ✅ Example:

```js
return new ApiResponse(
  200,
  { userId: "abc123", name: "Jane Doe" },
  "User fetched successfully"
);
```

---

## 🔁 Usage in Express Route Handler

```js
import { ApiError } from "./utils/ApiError.js";
import { ApiResponse } from "./utils/ApiResponse.js";

// Example controller
const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new ApiError(400, "Missing required fields", [
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" },
      ])
    );
  }

  const user = await createUser(email, password);

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User created successfully"));
};
```

---
