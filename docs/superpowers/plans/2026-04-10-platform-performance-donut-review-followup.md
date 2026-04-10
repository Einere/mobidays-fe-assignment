# Platform Performance Donut Review Follow-up        
                                                     
기준 범위: `c9b744eb` ~ `9a5ff706`                   
                                                     
## 해결 순서                                         
                                                     
1. 초기 로딩 실패가 빈 상태로 오인되는 분기 수정     
2. 도넛 조각 클릭의 키보드 접근성 보강               
3. unknown 플랫폼이 일반 토글에서 사라지는 문제 수정 
4. 타입 캐스팅(`as never`, `as PlatformMetricKey`) 제거                                                   
5. 플랫폼 정규화 로직의 책임 위치 정리               
6. Recharts payload 파싱 계약 명시화                 
7. 로딩 상태의 보조기술9 노출 보강                    
                                                     
## 리뷰에서 찾은 문제                                
                                                     
### High                                             
                                                     
- `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`                         
  - 첫 조회 실패가 에러 상태가 아니라 empty state로 표시된다.                                            
  - 사용자는 네트워크/조회 오류를 인지하지 못한다.   
                                                     
- `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`                        
  - 도넛 조각 클릭이 키보드 조작으로는 접근되지 않는다.                                                  
  - WCAG `Keyboard`, `Name, Role, Value` 위반 가능성이 있다.                                             
                                                     
### Medium                                           
                                                     
- `src/entities/global-filter/model/store.ts`        
  - unknown 플랫폼 보존 의도와 달리 일반 토글에서 값이 사라질 수 있다.                                   
                                                     
- `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`                         
  - 이벤트 핸들러에서 타입 캐스팅으로 계약을 우회한다.                                                    
                                                     
- `src/entities/global-filter/model/platforms.ts`    
  - `CampaignPlatform`을 `string`으로 넓히면서 도메인 경계가 흐려졌다.                                    
                                                     
- `src/widgets/global-filter/ui/global-filter-bar.tsx`                                                    
  - 플랫폼 보정 로직이 UI 컴포넌트에 들어가 있다.    
                                                     
- `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`                        
  - Recharts payload를 여러 후보로 추측하는 파서라 계약이 불명확하다.                                     
                                                     
- `src/widgets/platform-performance-chart/ui/platform
-performance-chart-card.tsx`                         
  - 초기 loading state가 보조기술에 충분히 전달되지않는다.                                              
                                                     
## 메모                                              
                                                     
- 성능 관점의 뚜렷한 회귀는 없었다.                  
- 이번 작업은 기능 추가 자체보다 상태 경계와 접근성보강이 우선이다.   