export class UserResponseDto {
  id: number;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}
