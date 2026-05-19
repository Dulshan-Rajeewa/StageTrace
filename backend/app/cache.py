from collections import OrderedDict


class BoundedCache:
    """
    Simple LRU cache with max_size limit and pattern-based invalidation.
    When cache exceeds max_size, oldest entries are evicted.
    """
    
    def __init__(self, max_size: int = 50):
        self.cache = OrderedDict()
        self.max_size = max_size
        
    
    def get(self, key: str):
        """Retrieve cached value, or None if not found."""
        return self.cache.get(key)
    
    
    def set(self, key: str, value):
        """Store value in cache. Evicts oldest entry if over max_size."""
        self.cache[key] = value
        self.cache.move_to_end(key)  # Mark as recently used

        if len(self.cache) > self.max_size:
            self.cache.popitem(last=False)  # Remove oldest (FIFO)


    def invalidate_pattern(self, pattern: str):
        """Delete all keys starting with pattern (e.g., 'incident:*')."""
        keys_to_delete = [k for k in self.cache if k.startswith(pattern)]
        for k in keys_to_delete:
            del self.cache[k]
            
            
    def clear(self):
        """Clear entire cache."""
        self.cache.clear()
        
        
# Global cache instance
cache = BoundedCache(max_size=50)