<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  product: {
    type: Object,
    required: true,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  favoriteLoading: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

// Emits keep this card reusable: the parent decides whether to route, open a modal, or add to Pinia.
const emit = defineEmits({
  add: (product) => Boolean(product?.id),
  favorite: (product) => Boolean(product?.id),
  view: (product) => Boolean(product?.id),
})
</script>

<template>
  <v-hover v-slot="{ isHovering, props: hoverProps }">
    <v-card
      v-bind="hoverProps"
      :class="['product-card h-100', { 'product-card--active': isHovering }]"
      elevation="0"
      rounded="lg"
      @click="emit('view', product)"
    >
      <div class="product-media position-relative">
        <v-img
          :alt="product.title"
          aspect-ratio="1"
          class="product-image"
          cover
          :src="product.image"
        >
          <template #placeholder>
            <v-skeleton-loader class="h-100" type="image" />
          </template>
        </v-img>

        <div class="media-tint" />

        <v-chip
          v-if="product.badge"
          class="badge-chip ma-3"
          color="accent"
          label
          size="small"
          variant="flat"
        >
          {{ product.badge }}
        </v-chip>

        <v-btn
          :aria-label="t('shop.favorite')"
          :class="['favorite-button', { 'favorite-button--active': favorite }]"
          :icon="favorite ? 'mdi-heart' : 'mdi-heart-outline'"
          :loading="favoriteLoading"
          size="small"
          @click.stop="emit('favorite', product)"
        />

        <v-btn
          aria-label="Quick add to cart"
          class="quick-add"
          icon="mdi-cart-plus"
          size="large"
          @click.stop="emit('add', product)"
        />
      </div>

      <v-card-text class="pa-4 pb-2">
        <div class="d-flex align-center justify-space-between mb-3">
          <v-chip class="category-chip" label size="x-small" variant="flat">
            {{ product.category }}
          </v-chip>
          <div class="d-flex align-center ga-1">
            <v-icon color="warning" icon="mdi-star" size="16" />
            <span class="text-caption font-weight-bold">{{ product.rating }}</span>
          </div>
        </div>

        <h3 class="product-title text-subtitle-1 font-weight-black mb-3">{{ product.title }}</h3>

        <div class="d-flex align-end justify-space-between ga-3">
          <div>
            <span class="text-h6 font-weight-black text-primary">${{ product.price.toFixed(2) }}</span>
            <span
              v-if="product.originalPrice > product.price"
              class="d-block text-caption text-medium-emphasis text-decoration-line-through"
            >
              ${{ product.originalPrice.toFixed(2) }}
            </span>
          </div>
          <span
            class="text-caption text-medium-emphasis"
          >
            {{ t('shop.reviews', { count: product.reviews }) }}
          </span>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-2">
        <v-btn
          block
          class="quick-add-button"
          color="primary"
          prepend-icon="mdi-lightning-bolt"
          rounded="lg"
          variant="flat"
          @click.stop="emit('add', product)"
        >
          {{ t('shop.quickAdd') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-hover>
</template>

<style scoped>
.product-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.18);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 220ms ease,
    box-shadow 220ms ease,
    transform 220ms ease;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
}

.product-card--active {
  border-color: rgba(13, 148, 136, 0.34);
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.16);
  transform: translateY(-8px);
}

.product-media {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(249, 115, 22, 0.08));
  overflow: hidden;
}

.product-image {
  transition: transform 420ms ease;
}

.product-card--active .product-image {
  transform: scale(1.08);
}

.media-tint {
  background: linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.42));
  inset: 0;
  opacity: 0;
  position: absolute;
  transition: opacity 220ms ease;
}

.product-card--active .media-tint {
  opacity: 1;
}

.badge-chip {
  box-shadow: 0 8px 18px rgba(249, 115, 22, 0.25);
  position: absolute;
  top: 0;
  left: 0;
}

.category-chip {
  background: rgba(13, 148, 136, 0.1);
  color: #0f766e;
}

.product-title {
  color: #172033;
  line-height: 1.35;
  min-height: 2.7em;
}

.quick-add {
  background: #ffffff;
  bottom: 14px;
  color: #172033;
  opacity: 0;
  position: absolute;
  right: 14px;
  transform: translateY(10px) scale(0.96);
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.favorite-button {
  background: rgba(255, 255, 255, 0.94);
  color: #172033;
  position: absolute;
  right: 14px;
  top: 14px;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.favorite-button:hover,
.favorite-button--active {
  background: #fff1f2;
  color: #e11d48;
  transform: scale(1.05);
}

.product-card--active .quick-add {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.quick-add-button {
  box-shadow: 0 12px 26px rgba(31, 41, 55, 0.18);
}
</style>
