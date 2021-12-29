<script lang='ts'>
import { defineComponent, ref } from 'vue'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';


// interface Book {
//   title: string
//   author: string
//   year: number
// }

export default defineComponent({
  serverPrefetch() {
    
  },
  props: {
    // username: String 
  },
  /**
  The new setup component option is executed before the component is created, 
  once the props are resolved, and serves as the entry point for composition APIs.

  You should avoid using this inside setup as it won't refer to the component instance. 
  setup is called before data properties, computed properties or methods are resolved, 
  so they won't be available within setup.

  window is not defined
  */
  setup(props) {
    if (import.meta.env.SSR) {

    } else {
      console.log(window.solana);
    }
  },
  // beforeCreate run after `setup`
  beforeCreate() {

  },
  // created run after `beforeCreate`
  created() {
    // console.log(WalletAdapterNetwork);
    // if (import.meta.env.SSR) {

    // } else {
    //   console.log(window.solana);
    // }
  },
  data() {
    return {
      // book: {
      //   title: 'Vue 3 Guide',
      //   author: 'Vue Team',
      //   year: 2020
      // } as Book
    }
  },
  computed: {
    // books(): Book{
    //   let books = {
    //     title: 'Vue 3 Guide',
    //     author: 'Vue Team',
    //     year: 2020
    //   }

    //   console.log(123123123);

    //   return books
    // }
  },
  mounted() {
    // const result = this.book // => Property 'split' does not exist on type 'number'

    // console.log(result, this.goblin, this.egg);
  },

})
</script>

<template>
    <div>group page</div>
</template>

<style scoped>

</style>