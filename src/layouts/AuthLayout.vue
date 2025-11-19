<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
    <!-- Контейнер формы -->
    <div class="w-full max-w-md">
      <!-- Логотип -->
      <div class="text-center mb-8 sm:mb-12 animate-fade-in-down">
        <div class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
          LMS Система
        </h1>
      </div>

      <!-- Форма -->
      <div class="bg-white rounded-lg shadow-xl p-8 sm:p-10 lg:p-12 animate-fade-in-up">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.5s ease-out;
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out 0.1s both;
}
</style>
