<script setup lang="ts">
import { computed } from 'vue'

// Video-game pill button: solid fill, thick dark outline, soft 3D "lip" that
// presses down on tap. No glossy highlight (intentionally removed). The class
// name `.gloss` is kept as the shared base across the prototypes.
//
// `tone` picks the fill:
//   region  → the active continent hue (via the inherited --region var)
//   correct → green (reserved feedback)
//   wrong   → red   (reserved feedback)
//   plain   → white surface, ink label (used for option / rate cards)
const props = withDefaults(
  defineProps<{
    tone?: 'region' | 'correct' | 'wrong' | 'plain'
    block?: boolean
    disabled?: boolean
  }>(),
  { tone: 'region', block: false, disabled: false },
)

const classes = computed(() => [
  'gloss',
  'appbtn',
  `appbtn--${props.tone}`,
  { 'appbtn--block': props.block },
])
</script>

<template>
  <button :class="classes" :disabled="disabled">
    <span class="lbl"><slot /></span>
  </button>
</template>

<style scoped>
/* ── Shared video-game button base (gloss-removed) ── */
.gloss {
  position: relative;
  border: 3px solid #222a33;
  border-radius: 999px;
  cursor: pointer;
  overflow: hidden;
  font-family: var(--font-display);
  font-weight: 800;
  box-shadow:
    0 5px 0 rgba(34, 42, 51, 0.22),
    0 9px 12px rgba(0, 0, 0, 0.14);
  transition:
    transform 0.08s ease,
    box-shadow 0.08s ease,
    filter 0.15s ease;
}
.gloss .lbl {
  position: relative;
  z-index: 1;
}
.gloss:active:not(:disabled) {
  transform: translateY(5px);
  box-shadow:
    0 0 0 rgba(34, 42, 51, 0.22),
    0 3px 5px rgba(0, 0, 0, 0.14);
}
.gloss:disabled {
  cursor: default;
}

.appbtn {
  padding: 17px 22px;
  font-size: 19px;
  color: #fff;
}
.appbtn--block {
  width: 100%;
}

.appbtn--region {
  background: var(--region, var(--color-europe));
}
.appbtn--correct {
  background: var(--color-correct);
}
.appbtn--wrong {
  background: var(--color-wrong);
}
.appbtn--plain {
  background: #fff;
  color: #2b2b3a;
}

/* Colored fills fade when disabled; the plain surface just dims its label. */
.appbtn--region:disabled,
.appbtn--correct:disabled,
.appbtn--wrong:disabled {
  filter: saturate(0.7) opacity(0.5);
}
.appbtn--plain:disabled {
  opacity: 0.5;
}
</style>
