import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidateCoordinatesPipe implements PipeTransform {
  transform(value: any) {
    const { latitude, longitude } = value;

    // 한국 영역 범위 확인
    if (
      latitude < 33 ||
      latitude > 38.6 ||
      longitude < 124.5 ||
      longitude > 132
    ) {
      throw new BadRequestException(
        '좌표가 유효한 범위를 벗어났습니다 (한국 영역만 지원)',
      );
    }

    // 바다 좌표 확인 (선택 - 외부 API 사용 시 활성화)
    // if (await this.isWaterCoordinate(latitude, longitude)) {
    //   throw new BadRequestException('유효하지 않은 좌표입니다 (바다)');
    // }

    return value;
  }
}
