export interface PencilLesson {
  letter: string;
  word: string;
  handwriting: string[];
  picture: string[];
  pictureKind: "bus" | "balloon";
}

// Centerline curves let the pencil follow the ink itself, rather than reveal a font mask.
export const pencilLessons: PencilLesson[] = [
  {
    letter: "А",
    word: "автобус",
    pictureKind: "bus",
    handwriting: [
      "M105 346 C144 349 173 293 198 238 L244 144 C249 133 258 130 260 144 L263 318 C265 338 275 346 288 335",
      "M155 279 C185 270 236 265 276 267",
      "M354 267 C333 250 309 269 304 293 C300 317 316 334 336 314 C348 302 355 279 354 267",
      "M358 264 L348 311 C345 330 356 333 373 315",
    ],
    picture: [
      "M454 285 L454 367 Q454 385 473 385 L661 385 Q680 385 680 367 L680 295 Q680 270 655 270 L480 270 Q454 270 454 285",
      "M470 286 L513 286 L513 324 L470 324 Z",
      "M526 286 L568 286 L568 324 L526 324 Z",
      "M581 286 L623 286 L623 324 L581 324 Z",
      "M638 286 L664 286 L664 366 L638 366 Z",
      "M479 385 C479 361 515 361 515 385 C515 409 479 409 479 385",
      "M622 385 C622 361 658 361 658 385 C658 409 622 409 622 385",
    ],
  },
  {
    letter: "Б",
    word: "балон",
    pictureKind: "balloon",
    handwriting: [
      "M144 200 C188 155 231 142 271 155 C247 159 215 161 181 170",
      "M203 169 C195 219 165 271 152 312 C147 333 155 349 179 343 C217 331 249 306 246 280 C242 247 189 253 171 280",
      "M360 226 C345 235 319 230 311 257 C305 277 302 294 309 314 C315 338 345 331 352 309 C361 280 332 268 314 288",
    ],
    picture: [
      "M572 255 C518 255 504 315 539 350 C550 362 557 369 572 375 C587 369 594 362 605 350 C640 315 626 255 572 255",
      "M572 375 L563 387 L581 387 Z",
      "M572 387 C550 410 600 423 570 448",
    ],
  },
];

export const WRITING_SECONDS = 3.4;
export const PICTURE_SECONDS = 2.5;
export const LESSON_SECONDS = WRITING_SECONDS + PICTURE_SECONDS + 2.6;
export type DrawingPhase = "writing" | "picture" | "complete";
