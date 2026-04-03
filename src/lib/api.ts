export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  role_ids: string[];
};

export class ApiError extends Error {
  code: "INVALID_CREDENTIALS" | "INVALID_INPUT" | "NETWORK";
  status?: number;

  constructor(
    code: ApiError["code"],
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const buildUrl = (path: string) => {
   
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  console.log( ` absolute path  is :-  ${base}`)
    debugger;
  return `${base}${normalizedPath}`;
};

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const endpoint = buildUrl("/api/auth/login");
   debugger; 
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as Partial<LoginResponse> & {
      error?: string;
    };

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError(
          "INVALID_CREDENTIALS",
          "Incorrect email or password.",
          response.status,
        );
      }

      if (response.status === 400) {
        throw new ApiError(
          "INVALID_INPUT",
          data.error || "Invalid input.",
          response.status,
        );
      }

      throw new ApiError(
        "NETWORK",
        data.error || "Something went wrong. Please try again.",
        response.status,
      );
    }

    if (!data.access_token) {
      throw new ApiError(
        "NETWORK",
        "Malformed response from server.",
        response.status,
      );
    }

    return data as LoginResponse;
  } catch (error) {
    if (error instanceof ApiError) {
     
      throw error;
    }
    throw new ApiError(
      "NETWORK",
      "Something went wrong. Please try again.",
    );
  }
}
