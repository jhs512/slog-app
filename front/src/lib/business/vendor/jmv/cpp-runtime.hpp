#pragma once
#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <functional>
#include <type_traits>
#include <typeinfo>
#include <sstream>

namespace __viz {
inline std::string quote(const std::string& s) {
  std::string o="\"";for(unsigned char c:s){if(c=='"'||c=='\\'){o+='\\';o+=c;}else if(c=='\n')o+="\\n";else if(c=='\r')o+="\\r";else if(c=='\t')o+="\\t";else if(c<32)o+='?';else o+=c;}return o+'"';
}
struct Watch {std::string name,type;uintptr_t address;bool initialized;std::function<std::string()> read;};
struct FrameData {std::string name;int id,line;std::vector<Watch> locals;std::string plans;};
inline std::vector<FrameData> frames;
inline std::vector<Watch> globals;
inline std::map<uintptr_t,int> ids;
inline std::map<int,std::string> heap;
struct Allocation {bool alive;std::string type;std::function<std::string()> read;};
inline std::map<uintptr_t,Allocation> allocations;
inline std::set<uintptr_t> initializedCells;
inline std::set<uintptr_t> ended;
inline void reset(const void* ptr,size_t bytes){auto address=reinterpret_cast<uintptr_t>(ptr);ended.erase(address);for(auto i=initializedCells.lower_bound(address);i!=initializedCells.end()&&*i<address+bytes;)i=initializedCells.erase(i);}
inline std::string fields(const char* type,std::initializer_list<std::pair<std::string,std::string>> fields){std::string result="[\"INSTANCE\","+quote(type);for(auto& field:fields)result+=",["+quote(field.first)+","+field.second+"]";return result+"]";}
template<class T,class F>T* allocated(T* p,const char* type,F read){if(p){auto address=reinterpret_cast<uintptr_t>(p);ids.erase(address);allocations[address]={true,type,[p,read]{return read(*p);}};}return p;}
template<class T>void releasing(T* p){auto found=allocations.find(reinterpret_cast<uintptr_t>(p));if(found!=allocations.end())found->second.alive=false;}
template<class F,class T>void destroy(F fn,T* p){fn();releasing(p);}
inline int nextID=1,nextFrame=1,steps=0,currentLine=1;
inline int identity(uintptr_t address){auto i=ids.find(address);if(i!=ids.end())return i->second;return ids[address]=nextID++;}
template<class T> std::string value(T& v);
template<class T> std::string fieldValue(T& v,bool known){return known||initializedCells.count(reinterpret_cast<uintptr_t>(&v))?value(v):"[\"UNAVAILABLE\"]";}
template<class T> std::string object(T& v) {
  if constexpr(std::is_array_v<T>){std::string result="[\"ARRAY\",\"C++ array\"";for(size_t i=0;i<std::extent_v<T>&&i<100;i++)result+=","+fieldValue(v[i],false);return result+"]";}
  else if constexpr(std::is_arithmetic_v<T>||std::is_enum_v<T>||std::is_pointer_v<T>)return "[\"INSTANCE\",\"저장 위치\",[\"값\","+value(v)+"]]";
  else return "[\"OPAQUE\",\"C++ object (필드 관측 없음)\"]";
}
template<class T> std::string value(T& v) {
  using V=std::remove_cv_t<T>;
  if constexpr(std::is_same_v<V,bool>)return v?"true":"false";
  else if constexpr(std::is_same_v<V,std::nullptr_t>)return "null";
  else if constexpr(std::is_enum_v<V>)return std::to_string(static_cast<std::underlying_type_t<V>>(v));
  else if constexpr(std::is_integral_v<V>)return std::to_string(v);
  else if constexpr(std::is_floating_point_v<V>){if(v!=v)return "[\"SPECIAL_FLOAT\",\"NaN\"]";if(v>1e308)return "[\"SPECIAL_FLOAT\",\"Infinity\"]";if(v< -1e308)return "[\"SPECIAL_FLOAT\",\"-Infinity\"]";return std::to_string(v);}
  else if constexpr(std::is_same_v<V,std::string>)return quote(v);
  else if constexpr(std::is_pointer_v<V>) {
    if(!v)return "null";
    int id=identity(reinterpret_cast<uintptr_t>(v));
    if(ended.count(reinterpret_cast<uintptr_t>(v))){heap[id]="[\"FREED\",\"stack object · 수명 종료\"]";return "[\"REF\","+std::to_string(id)+"]";}
    if(!heap.count(id)) {
      heap[id]="[\"OPAQUE\",\"pointer target\"]";
      auto allocation=allocations.find(reinterpret_cast<uintptr_t>(v));
      if(allocation!=allocations.end())heap[id]=allocation->second.alive?allocation->second.read():"[\"FREED\","+quote(allocation->second.type)+"]";
      // Only read a pointee whose lifetime is tracked. An arbitrary pointer may
      // be uninitialized, dangling, one-past, or point into inaccessible storage.
      for(auto& f:frames)for(auto& w:f.locals)if(w.address==reinterpret_cast<uintptr_t>(v)) {
        if(!w.initialized)heap[id]="[\"INSTANCE\",\"저장 위치\",[\"값\",[\"C_UNINITIALIZED\"]]]";
        else {heap.erase(id);auto encoded=w.read();if(encoded!="[\"REF\","+std::to_string(id)+"]")heap[id]="[\"INSTANCE\",\"저장 위치\",[\"값\","+encoded+"]]";}
      }
    }
    return "[\"REF\","+std::to_string(id)+"]";
  } else {
    int id=identity(reinterpret_cast<uintptr_t>(&v));if(!heap.count(id))heap[id]=object(v);return "[\"REF\","+std::to_string(id)+"]";
  }
}
template<class T> void watch(const char* name,T& v,bool init,const char* type){if(frames.empty())return;uintptr_t address=reinterpret_cast<uintptr_t>(&v);ended.erase(address);if constexpr(std::is_array_v<T>){for(size_t i=0;i<std::extent_v<T>;i++){if(init)initializedCells.insert(reinterpret_cast<uintptr_t>(&v[i]));else initializedCells.erase(reinterpret_cast<uintptr_t>(&v[i]));}init=true;}if(std::string(type).find('&')!=std::string::npos)for(auto& frame:frames)for(auto& prior:frame.locals)if(prior.address==address)init=prior.initialized;frames.back().locals.push_back({name,type,address,init,[&v]{return value(v);}});}
template<class T,class F> void watch(const char* name,T& v,bool init,const char* type,F read){if(frames.empty())return;ended.erase(reinterpret_cast<uintptr_t>(&v));frames.back().locals.push_back({name,type,reinterpret_cast<uintptr_t>(&v),init,[&v,read]{if(ended.count(reinterpret_cast<uintptr_t>(&v)))return std::string("[\"OBJECT_ENDED\"]");int id=identity(reinterpret_cast<uintptr_t>(&v));if(!heap.count(id)){heap[id]="[\"OPAQUE\",\"object\"]";heap[id]=read(v);}return "[\"REF\","+std::to_string(id)+"]";}});}
template<class T,class...Args>void global(const char* name,T& v,bool init,const char* type,Args... args){watch(name,v,init,type,args...);globals.push_back(frames.back().locals.back());frames.back().locals.pop_back();}
inline void initialized(const void* p){initializedCells.insert(reinterpret_cast<uintptr_t>(p));for(auto& f:frames)for(auto& w:f.locals)if(w.address==reinterpret_cast<uintptr_t>(p))w.initialized=true;}
inline void step(int line) {
  currentLine=line;if(frames.empty())return;frames.back().line=line;
  if(++steps>1500){std::fputs("\x1eJMV_LIMIT\n",stderr);std::exit(0);}
  heap.clear();
  std::string globalValues="{",globalNames="[";bool firstGlobal=true;for(auto& global:globals){if(!firstGlobal){globalValues+=",";globalNames+=",";}firstGlobal=false;globalValues+=quote(global.name)+":"+global.read();globalNames+=quote(global.name);}globalValues+="}";globalNames+="]";
  std::string stack="[";bool firstFrame=true;
  for(auto& f:frames){if(!firstFrame)stack+=",";firstFrame=false;
    std::string names="[",locals="{";bool first=true;
    for(size_t wi=0;wi<f.locals.size();wi++){auto& w=f.locals[wi];bool shadowed=false;for(size_t j=wi+1;j<f.locals.size();j++)if(f.locals[j].name==w.name)shadowed=true;if(shadowed)continue;if(!first){names+=",";locals+=",";}first=false;names+=quote(w.name);locals+=quote(w.name)+":"+(w.initialized?w.read():"[\"C_UNINITIALIZED\"]");}
    names+="]";locals+="}";
    stack+="{\"func_name\":"+quote(f.name)+",\"class\":\"\",\"frame_id\":"+std::to_string(f.id)+",\"line\":"+std::to_string(f.line)+",\"ordered_varnames\":"+names+",\"encoded_locals\":"+locals+",\"reserved_locals\":"+f.plans+",\"is_highlighted\":"+(&f==&frames.back()?"true":"false")+"}";
  }stack+="]";
  for(auto& allocation:allocations){int id=identity(allocation.first);if(!heap.count(id)){heap[id]="[\"OPAQUE\",\"object\"]";heap[id]=allocation.second.alive?allocation.second.read():"[\"FREED\","+quote(allocation.second.type)+"]";}}
  for(auto& frame:frames)for(auto& local:frame.locals)if(local.type.find('&')!=std::string::npos){int id=identity(local.address);if(!heap.count(id))heap[id]="[\"INSTANCE\",\"저장 위치\",[\"값\","+(local.initialized?local.read():"[\"C_UNINITIALIZED\"]")+"]]";}
  std::string bindings="[";bool firstBinding=true;for(auto& frame:frames)for(size_t li=0;li<frame.locals.size();li++){auto& local=frame.locals[li];bool shadowed=false;for(size_t j=li+1;j<frame.locals.size();j++)if(frame.locals[j].name==local.name)shadowed=true;if(shadowed)continue;auto found=ids.find(local.address);if(found!=ids.end()&&heap.count(found->second)){if(!firstBinding)bindings+=",";firstBinding=false;bindings+="{\"id\":"+std::to_string(found->second)+",\"name\":"+quote(local.name)+",\"frame_id\":"+std::to_string(frame.id)+"}";}}bindings+="]";
  std::string objects="{";bool first=true;for(auto& entry:heap){if(!first)objects+=",";first=false;objects+=quote(std::to_string(entry.first))+":"+entry.second;}objects+="}";
  std::string record="{\"event\":\"step_line\",\"line\":"+std::to_string(line)+",\"globals\":"+globalValues+",\"ordered_globals\":"+globalNames+",\"heap\":"+objects+",\"c_bindings\":"+bindings+",\"stack_to_render\":"+stack+"}";
  std::fflush(stdout);std::fputs(("\x1eJMV"+record+"\n").c_str(),stderr);
}
struct Frame {uintptr_t destroyed;Frame(const char* name,int line,const char* plans,uintptr_t address=0):destroyed(address){frames.push_back({name,nextFrame++,line,{},plans});}~Frame(){frames.pop_back();if(destroyed)ended.insert(destroyed);if(!frames.empty())step(frames.back().line);}};
struct Scope {size_t size;Scope():size(frames.back().locals.size()){}~Scope(){frames.back().locals.resize(size);}};
}
