export class UserResponseDto {
  id: number;
  username: string;
  email: string | null;
  /** Public S3 URL generated from the stored avatarPath, or null if unset. */
  avatarUrl: string | null;
  createdAt: Date;
}
