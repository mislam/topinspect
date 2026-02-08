// JWT payload structure for access tokens
export interface JwtPayload {
	sub: string
	iat: number
	exp: number
}
