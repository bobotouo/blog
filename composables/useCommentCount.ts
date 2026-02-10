import { onMounted, ref } from "vue";

export const useCommentCount = (path: string) => {
  const count = ref<number | null>(null);

  const load = async () => {
    const { data } = await useFetch("/api/comments", {
      query: { path },
      server: false,
    });

    if (data.value && typeof data.value.comments === "number") {
      count.value = data.value.comments;
    }
  };

  onMounted(() => {
    load();
  });

  return { count };
};
