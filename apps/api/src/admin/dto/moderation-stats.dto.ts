export class ModerationStatsDto {
  places!: {
    pending: number;
    total: number;
  };
  reviews!: {
    pending: number;
    total: number;
  };
}
