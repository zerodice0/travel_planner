import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

interface TextContent {
  name?: string;
  description?: string;
}

@Injectable()
export class ProfanityFilterPipe implements PipeTransform {
  transform(value: TextContent) {
    if (value && typeof value === 'object') {
      // Check name field
      if (value.name && this.containsProfanity(value.name)) {
        throw new BadRequestException('Place name contains inappropriate content');
      }

      // Check description field
      if (value.description && this.containsProfanity(value.description)) {
        throw new BadRequestException('Description contains inappropriate content');
      }
    }
    return value;
  }

  /**
   * Checks if text contains profanity or inappropriate content.
   *
   * NOTE (Phase 2): Replace with production profanity detection library.
   * Current implementation uses placeholder keywords for testing.
   *
   * @param text - Text to check for profanity
   * @returns true if profanity detected, false otherwise
   */
  private containsProfanity(text: string): boolean {
    // Placeholder implementation - Phase 2 will integrate profanity library
    const badWords = ['inappropriate1', 'inappropriate2'];
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word));
  }
}
