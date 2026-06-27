<script setup>
import { useRoute } from 'vue-router'
import ProductDetail from '../components/shop/ProductDetail.vue'

const route = useRoute()
</script>

<template>
  <ProductDetail :product-id="route.params.id" />
</template>
