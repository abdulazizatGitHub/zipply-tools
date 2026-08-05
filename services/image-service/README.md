# @toolforge/image-service

Image processing — resize, convert, compress, background-remove. libvips (sharp) is the leading
candidate for the Node tier; Pillow/OpenCV for the Python tier when ML-driven (background removal,
upscaling).

**Status:** Foundation-phase placeholder. Phase 2 implementation.

**GPU consideration:** ML-driven variants may need GPU workers (Modal or Fly.io GPU machines). Keep
CPU and GPU workloads on separate queues so a GPU shortage doesn't starve simple resize jobs.
