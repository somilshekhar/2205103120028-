const Log = async (stack, level, packageName, message) => {
  try {
    await fetch('http://20.244.56.144/evaluation-service/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stack, level, package: packageName, message }),
    });
  } catch (error) {
    console.error('Logging failed:', error);
  }
};

export default Log;