<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const activeSlide = ref(0)
let timerId

const slides = computed(() => [
  {
    title: t('shop.heroTitle'),
    text: t('shop.heroText'),
    eyebrow: t('shop.curated'),
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: t('shop.heroSlideTwoTitle'),
    text: t('shop.heroSlideTwoText'),
    eyebrow: t('shop.heroSlideTwoEyebrow'),
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: t('shop.heroSlideThreeTitle'),
    text: t('shop.heroSlideThreeText'),
    eyebrow: t('shop.heroSlideThreeEyebrow'),
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80',
  },
])

function goToSlide(index) {
  activeSlide.value = index
}

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % slides.value.length
}

onMounted(() => {
  timerId = window.setInterval(nextSlide, 5200)
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
})
</script>

<template>
  <section class="relative mx-auto mb-8 max-w-[1480px] overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-950/10">
    <div
      v-for="(slide, index) in slides"
      :key="slide.title"
      class="absolute inset-0 transition-opacity duration-700 ease-out"
      :class="index === activeSlide ? 'opacity-100' : 'opacity-0'"
    >
      <img :alt="slide.title" class="h-full min-h-[460px] w-full object-cover" :src="slide.image">
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent" />
      <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/60 to-transparent" />
    </div>

    <div class="relative z-10 flex min-h-[460px] flex-col justify-end px-6 py-8 text-white sm:px-10 lg:px-14">
      <div class="max-w-3xl">
        <span class="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-md">
          {{ slides[activeSlide].eyebrow }}
        </span>
        <h1 class="mb-4 text-4xl font-black leading-tight text-balance sm:text-5xl lg:text-6xl">
          {{ slides[activeSlide].title }}
        </h1>
        <p class="max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
          {{ slides[activeSlide].text }}
        </p>
      </div>

      <div class="mt-8 flex items-center gap-3">
        <button
          v-for="(_, index) in slides"
          :key="index"
          class="h-2.5 rounded-full transition-all duration-300"
          :class="index === activeSlide ? 'w-10 bg-orange-400' : 'w-2.5 bg-white/45 hover:bg-white'"
          type="button"
          @click="goToSlide(index)"
        />
      </div>
    </div>
  </section>
</template>
