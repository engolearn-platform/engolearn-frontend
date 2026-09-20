import { useFetch } from "@shared/hooks";
import { useCallback } from "react";
import type { TopicManagementStats, Topic } from "../types/topic.types";

export interface TopicManagementData {
  topics: Topic[];
  stats: TopicManagementStats;
}

const MOCK_TOPICS: Topic[] = [
  {
    id: "ordering-food",
    code: "TOP-EN-A2-042",
    titleEn: "Ordering Food at a Restaurant",
    titleVi: "Gọi món tại nhà hàng",
    cefr: "A2",
    category: "Dining & Food",
    itemsLabel: "4 Items",
    progress: { done: 4, total: 4, note: "Sẵn sàng xuất bản" },
    status: "published",
    updatedAt: "10 phút trước",
    thumbnail: "https://picsum.photos/seed/engo-food/80/80",
  },
  {
    id: "morning-routine",
    code: "TOP-EN-A1-011",
    titleEn: "Morning Routine & Daily Habits",
    titleVi: "Thói quen buổi sáng & hàng ngày",
    cefr: "A1",
    category: "Daily Life",
    itemsLabel: "3 Items",
    progress: { done: 3, total: 3, note: "Hoàn thiện" },
    status: "published",
    updatedAt: "2 giờ trước",
    thumbnail: "https://picsum.photos/seed/engo-morning/80/80",
  },
  {
    id: "airport-checkin",
    code: "TOP-EN-B1-023",
    titleEn: "At the Airport & Checking In",
    titleVi: "Tại sân bay & Làm thủ tục bay",
    cefr: "B1",
    category: "Travel",
    itemsLabel: "4 Items",
    progress: { done: 3, total: 4, note: "Cần Quiz Item 3" },
    status: "draft",
    updatedAt: "Hôm qua",
    thumbnail: "https://picsum.photos/seed/engo-airport/80/80",
  },
  {
    id: "job-interview",
    code: "TOP-EN-B2-008",
    titleEn: "Job Interview & Self Introduction",
    titleVi: "Phỏng vấn xin việc & Giới thiệu bản thân",
    cefr: "B2",
    category: "Career",
    itemsLabel: "5 Items",
    progress: { done: 5, total: 5, note: "Sẵn sàng xuất bản" },
    status: "published",
    updatedAt: "3 ngày trước",
    thumbnail: "https://picsum.photos/seed/engo-interview/80/80",
  },
  {
    id: "asking-directions",
    code: "TOP-EN-A1-017",
    titleEn: "Asking for Directions in the City",
    titleVi: "Hỏi và chỉ đường trong thành phố",
    cefr: "A1",
    category: "Travel",
    itemsLabel: "4 Items",
    progress: { done: 2, total: 4, note: "Đang sửa: Bước 2" },
    status: "draft",
    updatedAt: "5 ngày trước",
    thumbnail: "https://picsum.photos/seed/engo-directions/80/80",
  },
  {
    id: "hotel-booking",
    code: "TOP-EN-A2-031",
    titleEn: "Hotel Booking & Room Requests",
    titleVi: "Đặt phòng & Yêu cầu tại khách sạn",
    cefr: "A2",
    category: "Travel",
    itemsLabel: "3 Items",
    progress: { done: 1, total: 3, note: "Đang thêm audio" },
    status: "draft",
    updatedAt: "1 tuần trước",
    thumbnail: "https://picsum.photos/seed/engo-hotel/80/80",
  },
];

const MOCK_STATS: TopicManagementStats = {
  total: 24,
  published: 17,
  draft: 6,
  inProgress: 1,
};

export function useTopicManagement() {
  const fetchTopicManagement = useCallback(
    async (signal: AbortSignal): Promise<TopicManagementData> => {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return { topics: MOCK_TOPICS, stats: MOCK_STATS };
    },
    [],
  );

  const { data, loading, error, refetch } =
    useFetch<TopicManagementData>(fetchTopicManagement);

  return { data, loading, error, refetch };
}
