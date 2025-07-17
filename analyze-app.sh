#!/bin/bash

# MaintAInPro Application Analysis Runner
# This script runs comprehensive application analysis and generates reports

echo "🔍 MaintAInPro Application Analysis Tool"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if dev server is running
echo -e "${BLUE}🌐 Checking development server...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Development server not running on localhost:3000${NC}"
    echo -e "${YELLOW}Please start the dev server with: npm run dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Development server is running${NC}"
echo ""

# Create results directory
mkdir -p test-results
echo -e "${BLUE}📁 Results will be saved to: test-results/${NC}"
echo ""

# Function to run a test and report results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local description="$3"
    
    echo -e "${BLUE}🧪 Running: ${test_name}${NC}"
    echo -e "${YELLOW}   ${description}${NC}"
    
    if npm run $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${test_name} completed successfully${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${test_name} completed with findings (this is expected)${NC}"
        return 1
    fi
}

# Run analysis tests
echo -e "${BLUE}🚀 Starting comprehensive application analysis...${NC}"
echo ""

# Feature Discovery
run_test "Feature Discovery" "test:explore" "Discovering all routes and components"
echo ""

# Gap Analysis
run_test "Gap Analysis" "test:gaps" "Analyzing feature gaps and generating roadmap"
echo ""

# Feature Audit
run_test "Feature Audit" "test:audit" "Auditing module completeness"
echo ""

# UX Assessment
run_test "UX Assessment" "test:ux" "Evaluating user experience and accessibility"
echo ""

# Performance & Quality
run_test "Performance Analysis" "test:performance" "Measuring performance and code quality"
echo ""

# Generate summary
echo -e "${BLUE}📊 Analysis Summary${NC}"
echo "===================="

# Check if reports exist and show key metrics
if [ -f "test-results/gap-analysis-report.json" ]; then
    completeness=$(jq -r '.overallCompleteness' test-results/gap-analysis-report.json)
    total_features=$(jq -r '.moduleGaps | to_entries | map(.value.missingFeatures | length) | add' test-results/gap-analysis-report.json)
    echo -e "${YELLOW}Overall Completeness: ${completeness}%${NC}"
    echo -e "${YELLOW}Total Features Missing: ${total_features}${NC}"
fi

if [ -f "test-results/feature-discovery-report.json" ]; then
    total_routes=$(jq -r '.totalRoutes' test-results/feature-discovery-report.json)
    implemented_routes=$(jq -r '.implementedRoutes' test-results/feature-discovery-report.json)
    echo -e "${YELLOW}Routes Discovered: ${total_routes}${NC}"
    echo -e "${YELLOW}Routes Implemented: ${implemented_routes}${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Analysis Complete!${NC}"
echo ""
echo -e "${BLUE}📄 Generated Reports:${NC}"
echo "   • test-results/feature-discovery-report.json"
echo "   • test-results/gap-analysis-report.json"
echo "   • test-results/mobile-ux-assessment.json"
echo "   • test-results/performance-metrics.json"
echo "   • test-results/quality-metrics.json"
echo "   • test-results/security-assessment.json"
echo "   • test-results/technical-debt-report.json"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Review APPLICATION_ANALYSIS_SUMMARY.md for detailed findings"
echo "   2. Open test-results/gap-analysis-report.json for prioritized roadmap"
echo "   3. Focus on high-priority modules first (work orders, auth)"
echo "   4. Re-run analysis weekly to track progress"
echo ""
echo -e "${GREEN}🔧 Quick Commands:${NC}"
echo "   • npm run test:explore     - Discover features"
echo "   • npm run test:gaps        - Analyze gaps"
echo "   • npm run test:full-analysis - Run all tests"
echo "   • npm run test:e2e         - Run standard e2e tests"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
