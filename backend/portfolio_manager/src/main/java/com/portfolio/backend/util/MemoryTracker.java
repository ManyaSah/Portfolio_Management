package com.portfolio.backend.util;

public class MemoryTracker {

    public static long usedMemoryMB() {
        Runtime runtime = Runtime.getRuntime();
        return (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
    }
}
