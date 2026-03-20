import psutil
import time

def get_system_metrics() -> dict:
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    try:
        import subprocess
        result = subprocess.run(['nvidia-smi', '--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu', '--format=csv,noheader,nounits'], capture_output=True, text=True, timeout=2)
        gpu_data = result.stdout.strip().split(', ') if result.returncode == 0 else None
        gpu = {"util": float(gpu_data[0]), "mem_used": float(gpu_data[1]), "mem_total": float(gpu_data[2]), "temp": float(gpu_data[3])} if gpu_data else None
    except:
        gpu = None
    
    return {
        "cpu_percent": cpu,
        "ram_used_gb": round(mem.used / 1e9, 2),
        "ram_total_gb": round(mem.total / 1e9, 2),
        "ram_percent": mem.percent,
        "disk_used_gb": round(disk.used / 1e9, 2),
        "disk_total_gb": round(disk.total / 1e9, 2),
        "gpu": gpu,
        "timestamp": time.time()
    }
